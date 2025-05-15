const path = require('path');

module.exports = {
  entry: {
    'merchi_sdk': './src/js/merchi_sdk.js',
    'merchi_product_form': './src/js/merchi_product_form.js',
    'create_merchi_products': './src/js/create_merchi_products.js',
    'export_products': './src/js/export_products.js',
    'merchi_checkout_init': './src/js/merchi_checkout_init.js',
    'merchi_admin_custom': './src/js/merchi_admin_custom.js',
    'merchi_public_custom': './src/js/merchi_public_custom.js',
    'woocommerce_cart_checkout': './src/js/woocommerce_cart_checkout.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist/js'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              ['@babel/preset-react', { runtime: 'automatic' }]
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      'react': path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom')
    }
  }
};
