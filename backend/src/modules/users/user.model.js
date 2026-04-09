/**
 * @fileoverview Definición del esquema y modelo de Mongoose para la entidad de Usuario.
 */
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'El correo electrónico es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      select: false,
    },
    displayName: {
      type: String,
      required: [true, 'El nombre de usuario es obligatorio'],
      trim: true,
      minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
    },
    avatar: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['User', 'Admin'],
      default: 'User',
    },
    sewingLevel: {
      type: String,
      enum: ['Principiante', 'Intermedio', 'Experto'],
      default: null,
    },
    interests: [
      {
        type: String,
        trim: true,
      },
    ],
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('User', userSchema);
