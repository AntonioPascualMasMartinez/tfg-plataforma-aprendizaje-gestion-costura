const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const materialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: String, required: true },
  isAcquired: { type: Boolean, default: false },
});

const stepSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  mediaUrl: { type: String, default: null },
});

const projectSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    projectType: {
      type: String,
      enum: ['Nuevo', 'Comenzado desde Tutorial'],
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['Fácil', 'Intermedio', 'Avanzado'],
      required: true,
    },
    inspirationImageUrl: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Planificado', 'En curso', 'Pausado', 'Finalizado'],
      default: 'Planificado',
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    materials: [materialSchema],
    steps: [stepSchema],
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

projectSchema.plugin(mongoosePaginate);

projectSchema.pre(/^find/, function () {
  this.where({ deletedAt: null });
});

module.exports = mongoose.model('Project', projectSchema);
