import { getServiceVersion, openStream, config } from 'wappsto-redux';
import equal from 'deep-equal';
import { v4 as uuid } from 'uuid';

const mainStream = 'stream-main';
let subscriptions = {};
const newSubscriptions = { ...subscriptions };
let timeout;
let ws;

let defaultOptions = {
  endPoint: 'websocket',
  version: '2.0'
};

export const STATUS = {
  IDLE: 'idle',
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error',
  CANCELED: 'canceled'
};

export const ITEMS_PER_SLICE = 100;

export function getServiceUrl(service, options) {
  const version =
    options && options.version ? options.version : getServiceVersion(service);
  return `${config.baseUrl + (version ? `/${version}` : '')  }/${service}`;
}

function updateSubscriptions(options) {
  const subscriptionsKeys = Object.keys(subscriptions);
  const newSubscriptionsKeys = Object.keys(newSubscriptions);
  if (!equal(subscriptionsKeys, newSubscriptionsKeys)) {
    ws.send(
      JSON.stringify({
        jsonrpc: '2.0',
        method: 'PATCH',
        id: uuid(),
        params: {
          url: `${getServiceUrl(options.endPoint || options.service, options)}/open/subscription`,
          data: newSubscriptionsKeys
        }
      })
    );
  }
  subscriptions = { ...newSubscriptions };
}

export function setDefaultStreamOptions(options) {
  defaultOptions = options;
}

export function updateStream(dispatch, subscription, type, options = defaultOptions) {
  clearTimeout(timeout);
  if (type === 'add') {
    subscription.forEach((path) => {
      newSubscriptions[path] = (newSubscriptions[path] || 0) + 1;
    });
  } else {
    subscription.forEach((path) => {
      newSubscriptions[path] = (newSubscriptions[path] || 0) - 1;
      if (newSubscriptions[path] < 1) {
        delete newSubscriptions[path];
      }
    });
  }
  timeout = setTimeout(async () => {
    if (!ws || ws.readyState !== ws.OPEN) {
      ws = await dispatch(
        openStream(
          { name: mainStream, subscription: [], full: options.full || false },
          null,
          options
        )
      );
      ws.addEventListener('open', () => updateSubscriptions(options));
    } else {
      updateSubscriptions(options);
    }
  }, 200);
}

export function cannotAccessState(state) {
  return (
    state.status_payment === 'not_shared' ||
    state.status_payment === 'not_paid' ||
    state.status_payment === 'no_points' ||
    state.status_payment === 'open'
  );
}

export function countDecimals(value) {
  const text = value.toString();
  // verify if number 0.000005 is represented as "5e-6"
  if (text.indexOf('e-') > -1) {
    const trail = text.split('e-')[1];
    const deg = parseInt(trail, 10);
    return deg;
  }
  // count decimals for number in representation like "0.123456"
  if (Math.floor(value) !== value) {
    return value.toString().split('.')[1].length || 0;
  }
  return 0;
}

export function roundBasedOnStep(number, step, min) {
  let roundedNumber = Number(number);;
  if (Number.isNaN(roundedNumber) || step === 0) {
    return number;
  }
  if (number - min + min === number) {
    roundedNumber = step * Math.round((number - min) / step) + min;
  }
  roundedNumber = roundedNumber.toFixed(countDecimals(step));
  return roundedNumber;
}
