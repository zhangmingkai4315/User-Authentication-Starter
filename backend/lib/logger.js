import winston from 'winston';

export const logger = {
  transports: [
    new winston.transports.Console({
      colorize: true,
      msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
      colorStatus: true
    })
  ]
};
export const error_logger = {
      transports: [
        new winston.transports.Console({
          colorize: true,
          showStack: true
        })
      ]
}
