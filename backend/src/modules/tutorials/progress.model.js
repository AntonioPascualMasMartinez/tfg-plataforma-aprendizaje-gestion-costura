const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tutorialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tutorial', required: true },
    derivedProjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true }, // Referencia al proyecto clonado
    status: {
      type: String,
      enum: ['En curso', 'Completado'],
      default: 'En curso',
    },
    currentStep: { type: Number, default: 0 },
    completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true, versionKey: false },
);

// Índice compuesto único: Un usuario no puede registrar dos veces el inicio del mismo tutorial
progressSchema.index({ userId: 1, tutorialId: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
