const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

// Subesquema para los Materiales
const materialSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'El nombre del material es obligatorio'] },
  quantity: { type: String, required: [true, 'La cantidad es obligatoria'] },
  isAcquired: { type: Boolean, default: false },
});

// Subesquema para los Pasos Secuenciales
const stepSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  title: { type: String, required: [true, 'El título del paso es obligatorio'] },
  description: { type: String, required: true },
  mediaUrl: { type: String, default: null }, // URL devuelta por Cloudinary
});

// Esquema Principal del Proyecto Textil
const projectSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Indexado para búsquedas rápidas por usuario
    },
    title: {
      type: String,
      required: [true, 'El título del proyecto es obligatorio'],
      trim: true,
      maxlength: 100,
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
      default: true, // Si es falso, no aparecerá en el feed de la comunidad
    },
    materials: [materialSchema],
    steps: [stepSchema],

    // RNF20, RNF21: Borrado Lógico (Soft Delete)
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

// Plugin para habilitar paginación (Tabla 32 de la memoria)
projectSchema.plugin(mongoosePaginate);

// Middleware de Mongoose: Excluir automáticamente los proyectos "borrados" de todas las consultas FIND
projectSchema.pre(/^find/, function () {
  this.where({ deletedAt: null });
});

module.exports = mongoose.model('Project', projectSchema);
