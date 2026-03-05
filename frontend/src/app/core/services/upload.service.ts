import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';

export interface CloudinarySignature {
  timestamp: number;
  signature: string;
  folder: string;
  cloudName: string;
  apiKey: string;
}

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/uploads`;

  uploadImage(file: File, folder: string = 'costura_projects'): Observable<any> {
    return this.http
      .get<ApiResponse<CloudinarySignature>>(`${this.apiUrl}/signature?folder=${folder}`)
      .pipe(
        switchMap((response) => {
          const sigData = response.data;
          const formData = new FormData();

          formData.append('file', file);
          formData.append('api_key', sigData.apiKey);
          formData.append('timestamp', sigData.timestamp.toString());
          formData.append('signature', sigData.signature);
          formData.append('folder', sigData.folder);

          const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`;
          return this.http.post(cloudinaryUrl, formData);
        }),
      );
  }
}
