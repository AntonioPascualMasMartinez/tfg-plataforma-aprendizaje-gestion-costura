/**
 * @fileoverview Controlador para la gestión de subida de archivos multimedia a la nube.
 */
const UploadService = require('./upload.service');
const ResponseFormatter = require('../../utils/responseFormatter');

class UploadController {
  /**
   * Genera y retorna los parámetros de seguridad (firma) para autorizar subidas directas a Cloudinary.
   * @param {Object} req - Objeto de petición Express.
   * @param {Object} res - Objeto de respuesta Express.
   * @param {Function} next - Función callback para manejo de errores.
   */
  static getSignature(req, res, next) {
    try {
      let folder = req.query.folder || 'costura_projects';
      folder = folder.replace(/[^a-zA-Z0-9_-]/g, '');

      const signatureData = UploadService.generateSignature(folder);

      return ResponseFormatter.success(
        res,
        200,
        'Firma de seguridad generada exitosamente.',
        signatureData,
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UploadController;
