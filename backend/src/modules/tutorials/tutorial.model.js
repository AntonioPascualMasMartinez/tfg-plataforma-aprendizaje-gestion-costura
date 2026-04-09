/**
 * @fileoverview Definición del esquema y modelo de Mongoose para la entidad Tutorial.
 */
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const tutorialStepSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  mediaUrl: { type: String, default: null },
});

const tutorialSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'El título es obligatorio'], trim: true },
    description: { type: String, required: true },
    difficultyLevel: {
      type: String,
      enum: ['Principiante', 'Intermedio', 'Avanzado'],
      default: 'Principiante',
    },
    category: { type: String, required: true, trim: true },
    estimatedTime: { type: Number, default: 0 },
    steps: [tutorialStepSchema],
    materialsNeeded: [
      {
        name: { type: String, required: true },
        quantity: { type: String, required: true },
      },
    ],
  },
  { timestamps: true, versionKey: false },
);

tutorialSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Tutorial', tutorialSchema);
