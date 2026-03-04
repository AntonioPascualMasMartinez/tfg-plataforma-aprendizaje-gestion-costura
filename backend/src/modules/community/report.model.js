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
    // targetId no tiene un 'ref' estático. Su referencia se determina dinámicamente por targetType
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'targetType' },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ['Pending', 'Reviewed', 'Dismissed'],
      default: 'Pending',
    },
  },
  { timestamps: true, versionKey: false },
);

// Índice para que los administradores puedan filtrar rápidamente los reportes pendientes
reportSchema.index({ status: 1, createdAt: 1 });

reportSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Report', reportSchema);
