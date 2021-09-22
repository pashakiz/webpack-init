const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const fs = require('fs');
const webpack = require('webpack');

const isDev = process.env.NODE_ENV === 'development';
const isProd = !isDev;

function generateHtmlPlugins(templateDir) {
  const templateFiles = fs.readdirSync(path.resolve(__dirname, templateDir));
  return templateFiles.map(item => {
    const parts = item.split('.');
    const name = parts[0];
    const extension = parts[1];
    return new HtmlWebpackPlugin({
      filename: `${name}.html`,
      template: path.resolve(__dirname, `${templateDir}/${name}.${extension}`),
      minify: {
        collapseWhitespace: isProd
      },
      inject: true,
    })
  })
}

const htmlPlugins = generateHtmlPlugins('./src/html/views')

const optimization = () => {
  const config = {
    splitChunks: {
      chunks: 'all'
    }
  }
  if (isProd) {
    config.minimizer = [
      new CssMinimizerPlugin(),
      new TerserWebpackPlugin()
    ]
  }
  return config
}

const filename = ext => isDev ? `[name].${ext}` : `[name].[contenthash].${ext}`;

const cssLoaders = extra => {
  const loaders = [
    {
      loader: MiniCssExtractPlugin.loader,
    },
    {
      loader: 'css-loader',
      options: {
        url: false
      }
    }
  ];
  if (extra) {
    if ( Array.isArray(extra) ) {
      extra.forEach((someLoader) => {
        loaders.push(someLoader)
      })
    } else {
      loaders.push(extra)
    }
  }
  return loaders
}

const babelOptions = preset => {
  const opts = {
    presets: [
      '@babel/preset-env'
    ],
    plugins: [
      '@babel/plugin-proposal-class-properties'
    ]
  }

  if (preset) {
    opts.presets.push(preset)
  }

  return opts
}

module.exports = {
  mode: isProd ? 'production' : 'development',
  target: isProd ? 'browserslist' : 'web',
  entry: [
    '@babel/polyfill',
    './src/js/index.js'
  ],
  output: {
    filename: 'assets/js/' + filename('js'),
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  devServer: {
    port: 4250,
    hot: isDev
  },
  devtool: isDev ? 'source-map' : false,
  resolve: {
    //extensions: ['.js', '.json', '.png'],
    alias: {
      '@views': path.resolve(__dirname, 'src/html/views'),
      '@includes': path.resolve(__dirname, 'src/html/includes'),
      '@scss': path.resolve(__dirname, 'src/scss'),
      '@': path.resolve(__dirname, 'src'),
    }
  },
  optimization: optimization(),
  module: {
    rules: [
      {
        test: /\.html$/,
        type: 'asset/source',
        include: path.resolve(__dirname, 'src/html/includes'),
      },
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: babelOptions()
        }
      },
      {
        test: /\.css$/,
        use: cssLoaders()
      },
      {
        test: /\.s[ac]ss$/,
        use: cssLoaders([
            { loader: 'postcss-loader', },
            { loader: 'sass-loader' }
          ])
      },
      {
        test: /\.(png|jpg|jpeg|svg|gif|mp4)$/,
        type: 'asset/resource',
      },
      {
        test: /\.(ttf|otf|svg|woff|woff2|eot)$/,
        type: 'asset/resource',
      },
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'assets/css/' + filename('css'),
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src/favicon'),
          to: path.resolve(__dirname, 'dist')
        },
        {
          from: path.resolve(__dirname, 'src/assets'),
          to: path.resolve(__dirname, 'dist/assets')
        }
      ],
    }),
  ].concat(htmlPlugins)
};
