import { notification } from 'antd';

export function showErrorNotification(title:string, description?:string){
  let config = {
    message: title
  }
  if(description){
    config.description = description;
  }
  notification.error(config)
}

export function showSuccessNotification(title:string, description?:string){
  let config = {
    message: title
  }
  if(description){
    config.description = description;
  }
  notification.success(config);
}