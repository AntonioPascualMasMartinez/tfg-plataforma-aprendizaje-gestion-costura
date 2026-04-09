/**
 * @fileoverview Definición del esquema de Mongoose para el sistema de reportes y moderación.
 * Emplea relaciones polimórficas (refPath) para apuntar a diferentes tipos de entidades.
 */
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const reportSchema = new mongoose.Schema(
  {
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: {
      type: String,
      enum: ['Project', 'Comment'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'targetType',
    },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ['Pending', 'Reviewed', 'Dismissed'],
      default: 'Pending',
    },
  },
  { timestamps: true, versionKey: false },
);

reportSchema.index({ status: 1, createdAt: 1 });

reportSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Report', reportSchema);
