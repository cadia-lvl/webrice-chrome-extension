export const show = (element) => {
  if (isHidden(element)) {
    element.classList.remove('webrice_hide');
  }
};

export const hide = (element) => {
  if (!isHidden(element)) {
    element.classList.add('webrice_hide');
  }
};

export const isHidden = (element) => {
  return element.classList.contains('webrice_hide');
};
