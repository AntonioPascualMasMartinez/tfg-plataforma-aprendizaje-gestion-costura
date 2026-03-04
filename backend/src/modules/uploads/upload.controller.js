const UploadService = require('./upload.service');
const ResponseFormatter = require('../../utils/responseFormatter');

class UploadController {
  /**
   * GET /api/v1/uploads/signature
   * Retorna los parámetros de seguridad para una subida a Cloudinary.
   */
  static getSignature(req, res, next) {
    try {
      // Extraemos la carpeta deseada de la query de la URL (por defecto 'costura_projects')
      // Validamos que sea un string alfanumérico básico para evitar inyecciones en el nombre de la carpeta
      let folder = req.query.folder || 'costura_projects';
      folder = folder.replace(/[^a-zA-Z0-9_-]/g, '');

      // Generar el payload criptográfico
      const signatureData = UploadService.generateSignature(folder);

      // Retornar la firma al frontend siguiendo el contrato de respuesta estandarizado
      return ResponseFormatter.success(
        res,
        200,
        'Firma de seguridad generada exitosamente. Lista para subida directa.',
        signatureData,
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UploadController;
