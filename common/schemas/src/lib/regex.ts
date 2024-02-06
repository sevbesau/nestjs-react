export const PHONE_NUMBER_RE =
  /\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;

export const STREET_RE = /^(\w|\s|[,-])+$/i;
export const ZIP_RE = /^\d{4}$/g;
export const CITY_RE = /^(\w|\s|[,])+$/i;

export const TIME_RE = /^(0|1)\d:[0-6]\d$/;
