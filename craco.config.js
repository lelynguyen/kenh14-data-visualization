// craco.config.js
module.exports = {
    webpack: {
      configure: (webpackConfig) => {
        const sourceMapLoader = webpackConfig.module.rules.find(
          (rule) =>
            rule.enforce === 'pre' &&
            rule.use &&
            rule.use.some((u) => u.loader && u.loader.includes('source-map-loader'))
        );
  
        if (sourceMapLoader) {
          sourceMapLoader.exclude = (sourceMapLoader.exclude || []).concat([
            /node_modules\/plotly.js/,
          ]);
        }
  
        return webpackConfig;
      },
    },
  };
  