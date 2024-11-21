module.exports = {
    // Các cấu hình khác
    module: {
      rules: [
        // Các rule khác
        {
          test: /\.js$/,
          enforce: 'pre',
          use: ['source-map-loader'],
          exclude: /node_modules\/plotly.js/
        }
      ]
    }
  };