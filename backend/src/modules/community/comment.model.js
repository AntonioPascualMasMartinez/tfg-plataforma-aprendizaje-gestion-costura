const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const commentSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: {
      type: String,
      required: [true, 'El comentario no puede estar vacío'],
      trim: true,
      maxlength: 1000,
    },
    likesCount: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

// Índice compuesto para optimizar la paginación cronológica (Proyecto + Fecha)
commentSchema.index({ projectId: 1, createdAt: -1 });

commentSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Comment', commentSchema);
