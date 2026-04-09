/**
 * @fileoverview Definición del esquema de Mongoose para el seguimiento del progreso en los tutoriales.
 */
const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tutorialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tutorial', required: true },
    derivedProjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
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

// Garantiza que un usuario no pueda registrar múltiples progresos activos para el mismo tutorial
progressSchema.index({ userId: 1, tutorialId: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
