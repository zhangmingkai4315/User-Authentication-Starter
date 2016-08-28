import winston from 'winston';
import config from 'config';

const log_config = config.get('Logger')

export const production_logger = {
  transports: [
    new winston.transports.File({
      filename: log_config['access_file'],
      level:'info'
    })
  ]
};

export const development_logger = {
    transports: [
      new winston.transports.Console({
        json: true,
        colorize: true
      })
    ],
    meta: true,
    msg: 'HTTP {{req.method}} {{req.url}}',
    expressFormat: true,
    colorize: true
};
export const production_error_logger = {
      transports: [
        new winston.transports.File({
          filename: log_config['error_file']
        })
      ]
}

export const development_error_logger = {
        transports: [
          new winston.transports.Console({
            json: true,
            colorize: true
          })
        ]
}
