const Class = require("../models/Class");
const Arm = require("../models/Arm");

//////////////////////////
// CLASS MANAGEMENT
//////////////////////////

// Create class with optional arms
exports.createClass = async (req, res) => {
  try {
    const { name, arms } = req.body;

    // Check if class already exists
    const exists = await Class.findOne({ name });
    if (exists) return res.status(400).json({ message: "Class already exists" });

    // Create new class
    const newClass = await Class.create({ name });

    let classArms = [];
    if (Array.isArray(arms) && arms.length > 0) {
      const armsToCreate = arms.map((armName) => ({
        name: armName,
        class: newClass._id,
      }));
      classArms = await Arm.insertMany(armsToCreate);
    }

    // Return class with its arms
    const response = {
      _id: newClass._id,
      name: newClass.name,
      createdAt: newClass.createdAt,
      updatedAt: newClass.updatedAt,
      arms: classArms,
    };

    res.status(201).json(response);
  } catch (err) {
    console.error("Create class error:", err);
    res.status(500).json({ message: err.message });
  }
};

// List all classes with arms
exports.getClasses = async (req, res) => {
  try {
    const classes = await Class.find().sort({ name: 1 }).lean();
    const classesWithArms = await Promise.all(
      classes.map(async (cls) => {
        const arms = await Arm.find({ class: cls._id });
        return { ...cls, arms };
      })
    );
    res.json(classesWithArms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update class
exports.updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;
    const cls = await Class.findByIdAndUpdate(id, { name, code }, { new: true });
    res.json(cls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update class
// exports.updateClass = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name } = req.body;
//     const cls = await Class.findByIdAndUpdate(id, { name }, { new: true });
//     res.json(cls);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };


// Delete class and its arms
exports.deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    await Class.findByIdAndDelete(id);
    await Arm.deleteMany({ class: id });
    res.json({ message: "Class and its arms deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//////////////////////////
// ARM MANAGEMENT
//////////////////////////

// Add an arm to a class
exports.addArm = async (req, res) => {
  try {
    const { classId } = req.params;
    const { name } = req.body;

    const exists = await Arm.findOne({ name, class: classId });
    if (exists) return res.status(400).json({ message: "Arm already exists in this class" });

    const arm = await Arm.create({ name, class: classId });
    res.status(201).json(arm);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update an arm
exports.updateArm = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const arm = await Arm.findByIdAndUpdate(id, { name }, { new: true });
    res.json(arm);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete an arm
exports.deleteArm = async (req, res) => {
  try {
    const { id } = req.params;
    await Arm.findByIdAndDelete(id);
    res.json({ message: "Arm deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
