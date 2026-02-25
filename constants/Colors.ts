// University of Guelph brand colours
const tintColorLight = '#CC0000'; // Gryphon Red
const tintColorDark = '#FFC72C';  // Gryphon Gold

/** UofG brand tokens for use throughout the app */
export const UofG = {
  red:        '#CC0000', // Primary Gryphon Red
  gold:       '#FFC72C', // Gryphon Gold
  redLight:   '#FFF0F0', // Light red tint (backgrounds)
  goldLight:  '#FFF8E1', // Light gold tint (backgrounds)
  redDark:    '#990000', // Pressed / darker red
};

export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
  },
};
