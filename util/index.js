import { getServiceVersion } from 'wappsto-redux/util/helpers';
import { openStream, status } from 'wappsto-redux/actions/stream';
import config from 'wappsto-redux/config';
import equal from 'deep-equal';
import uuid from 'uuid/v4';

export const ITEMS_PER_SLICE = 100;

export function getLastKey(data){
  if(!data){
    return undefined;
  }
  let keys = Object.keys(data);
  return keys[keys.length - 1];
}

export function getNextKey(data){
  const lastKey = getLastKey(data) || 0;
  return parseInt(lastKey) + 1;
}

function mergeUnique(arr1, arr2){
  let arr = [...arr1];
  arr2.forEach(e => {
    if(!arr1.includes(e)){
      arr.push(e);
    }
  });
  return arr;
}

let defaultOptions = {
  endPoint: 'websocket',
  version: '2.0'
};
export function setDefaultStreamOptions(options){
  defaultOptions = options;
}
let subscriptions = {};
let newSubscriptions = {...subscriptions};
let timeout;
let ws;

const mainStream = 'stream-main';
function updateSubscriptions(options){
  if(!equal(subscriptions, newSubscriptions)){
    const sub = Object.keys(newSubscriptions);
    ws.send(JSON.stringify({
      jsonrpc: '2.0',
      method: 'PATCH',
      id: uuid(),
      params: {
        url: `${getServiceUrl(options.endPoint || options.service, options)}/open/subscription`,
        data: sub,
      }
    }));
    subscriptions = {...newSubscriptions};
  }
}
export function updateStream(dispatch, subscription, type, options=defaultOptions){
  clearTimeout(timeout);
  if(type === 'add'){
    subscription.forEach(path => {
      newSubscriptions[path] = (newSubscriptions[path] || 0) + 1;
    });
  } else {
    subscription.forEach(path => {
      newSubscriptions[path] = (newSubscriptions[path] || 0) - 1;
      if(newSubscriptions[path] < 1){
        delete newSubscriptions[path];
      }
    });
  }
  timeout = setTimeout(function () {
    if(!ws || ws.readyState !== ws.OPEN){
      ws = dispatch(openStream({ name: mainStream, subscription: [], full: options.full || false }, null, options));
      ws.addEventListener('open', () => updateSubscriptions(options));
      window.samiWs = ws;
    } else {
      updateSubscriptions(options);
    }
  }, 200);
}

export function getServiceUrl(service, options){
  const version = options && options.hasOwnProperty('version') ? options.version : getServiceVersion(service);
  return config.baseUrl + (version ? '/' + version : '') + '/' + service;
}

export function isPrototype(item){
  return item.meta && !item.meta.iot && !item.meta.application;
}

export function cannotAccessState(state){
  return state.status_payment === 'not_shared' || state.status_payment === 'not_paid' || state.status_payment === 'open';
}

export function getDottedText(text, num = 4, separator = ' ... '){
  return text.slice(0,num) + separator + text.slice(-num);
}
