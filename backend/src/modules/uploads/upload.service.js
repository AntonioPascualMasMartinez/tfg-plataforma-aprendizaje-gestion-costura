/**
 * @fileoverview Servicio encargado de la lógica criptográfica y comunicación con el proveedor multimedia.
 */
const cloudinary = require('../../config/cloudinary');
const ApiError = require('../../utils/apiError');

class UploadService {
  /**
   * Genera una firma criptográfica temporal para permitir subidas directas y seguras a Cloudinary desde el cliente.
   * Evita la exposición del API Secret en el frontend.
   * @param {string} [folderName='costura_projects'] - Carpeta de destino en el almacenamiento en la nube.
   * @returns {Object} Objeto que contiene la firma, el timestamp y las credenciales públicas necesarias.
   * @throws {ApiError} Si ocurre un error interno durante la generación de la firma mediante el SDK.
   */
  static generateSignature(folderName = 'costura_projects') {
    try {
      const timestamp = Math.round(new Date().getTime() / 1000);

      const paramsToSign = {
        timestamp: timestamp,
        folder: folderName,
      };

      const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        process.env.CLOUDINARY_API_SECRET,
      );

      return {
        timestamp,
        signature,
        folder: folderName,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
      };
    } catch (error) {
      throw new ApiError(
        500,
        'Error interno al generar la firma criptográfica para el proveedor multimedia.',
        false,
      );
    }
  }
}

module.exports = UploadService;
