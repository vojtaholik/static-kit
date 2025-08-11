import autoprefixer from "autoprefixer";
import sortMediaQueries from "postcss-sort-media-queries";

export default {
  plugins: [
    autoprefixer(),
    // Merge/sort media queries to emulate legacy mq-packing intent
    sortMediaQueries(),
  ],
};
