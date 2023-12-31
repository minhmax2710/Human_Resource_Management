import { Component, EventEmitter, Injector, OnInit, Output } from '@angular/core';
import { AppComponentBase } from '@shared/app-component-base';
import { ImageCroppedEvent } from 'ngx-image-cropper';
@Component({
  selector: 'app-upload-avatar',
  templateUrl: './upload-avatar.component.html',
  styleUrls: ['./upload-avatar.component.css']
})
export class UploadAvatarComponent implements OnInit {
  @Output() fileUploaded: EventEmitter<boolean> = new EventEmitter<boolean>()
  isLoading = false;
  imageUrl;
  id;
  response;
  title = 'angular-image-uploader';
  file;
  imageChangedEvent: any = '';
  croppedImage: any;
  
  constructor() {
  }

  ngOnInit(): void {
  }

  fileChangeEvent(event: any): void {
    this.imageChangedEvent = event;
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.base64;
    //this.file = new File([this.dataURItoBlob(this.croppedImage)], "image.jpg");
    if (!navigator.msSaveBlob) {
      this.file = new File([this.dataURItoBlob(this.croppedImage)], "image.jpg");
    } else {
      this.file = this.blobToFile(this.dataURItoBlob(this.croppedImage), "image.jpg");
    }
  }
  imageLoaded() {
    // show cropper
  }
  cropperReady() {
    // cropper ready
  }
  loadImageFailed() {
    // show message
  }

  dataURItoBlob(dataURI): Blob {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    let ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: 'image/jpeg' });
  }

  blobToFile(theBlob: Blob, fileName: string): File {
    const b: any = theBlob;
    Object.assign(b, { name: "", lastModified: "" });
    b.lastModifiedDate = new Date();
    b.name = fileName;
    return <File>b;
  }

}
