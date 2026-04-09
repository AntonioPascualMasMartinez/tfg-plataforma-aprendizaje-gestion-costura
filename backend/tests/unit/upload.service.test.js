/**
 * @fileoverview Pruebas unitarias para el servicio criptográfico de subidas a la nube.
 */
const UploadService = require('../../src/modules/uploads/upload.service');
const cloudinary = require('../../src/config/cloudinary');

jest.mock('../../src/config/cloudinary', () => ({
  utils: {
    api_sign_request: jest.fn(),
  },
}));

describe('UploadService - Pruebas Unitarias', () => {
  beforeAll(() => {
    process.env.CLOUDINARY_API_SECRET = 'secreto_falso';
    process.env.CLOUDINARY_API_KEY = 'key_falsa';
    process.env.CLOUDINARY_CLOUD_NAME = 'cloud_falso';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSignature()', () => {
    it('Debe generar la firma SHA válida y encapsular los metadatos de autorización', () => {
      cloudinary.utils.api_sign_request.mockReturnValue('hash_sha_12345');

      const result = UploadService.generateSignature('test_folder');

      expect(cloudinary.utils.api_sign_request).toHaveBeenCalledWith(
        expect.objectContaining({ folder: 'test_folder', timestamp: expect.any(Number) }),
        'secreto_falso',
      );

      expect(result).toHaveProperty('signature', 'hash_sha_12345');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('cloudName', 'cloud_falso');
      expect(result).toHaveProperty('apiKey', 'key_falsa');
    });

    it('Debe inyectar "costura_projects" como carpeta de destino por defecto', () => {
      cloudinary.utils.api_sign_request.mockReturnValue('hash_default');

      const result = UploadService.generateSignature();

      expect(result.folder).toBe('costura_projects');
    });
  });
});
