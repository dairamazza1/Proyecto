const sizes = {
  mobile: 576,
  tablet: 768,
  laptop: 992,
  desktop: 1200,
};

const px = (value) => `${value}px`;
const maxPx = (value) => `${value - 0.02}px`;

export { sizes };
export const Device = {
  mobile: `(min-width: ${px(sizes.mobile)})`,
  tablet: `(min-width: ${px(sizes.tablet)})`,
  laptop: `(min-width: ${px(sizes.laptop)})`,
  desktop: `(min-width: ${px(sizes.desktop)})`,
};

export const DeviceMax = {
  mobile: `(max-width: ${maxPx(sizes.mobile)})`,
  tablet: `(max-width: ${maxPx(sizes.tablet)})`,
  laptop: `(max-width: ${maxPx(sizes.laptop)})`,
  desktop: `(max-width: ${maxPx(sizes.desktop)})`,
};
