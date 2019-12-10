import { getServiceVersion } from 'wappsto-redux/util/helpers';
import { openStream, closeStream, updateStream as updateReduxStream } from 'wappsto-redux/actions/stream';
import config from 'wappsto-redux/config';

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

const defaultOptions = {
  endPoint: 'websocket',
  version: '2.0'
};
const subscriptions = {};
const subscriptionNumber = {};
let timeout;
function removeArr(arr1, arr2){
  return arr1.filter(path => {
    if((!subscriptionNumber[path] || subscriptionNumber[path] < 1) && arr2.find(path2 => path2 === path)){
      return false;
    }
    return true;
  });
}

function updateSubscriptionNumber(subscriptions, number=1){
  subscriptions.forEach(path => {
    subscriptionNumber[path] = (subscriptionNumber[path] || 0) + number;
    if(subscriptionNumber[path] < 1){
      delete subscriptionNumber[path];
    }
  });
}

const mainStream = 'stream-main';
const secondaryStream = 'stream-secondary';
export function updateStream(dispatch, subscription, type, options=defaultOptions){
  if(subscription.length === 0){
    return;
  }
  if(!subscriptions.old){
    if(type === 'add'){
      subscriptions.old = subscription;
      dispatch(openStream({ name: mainStream, subscription, full: false }, null, options));
      updateSubscriptionNumber(subscription, 1);
    }
  } else {
    let newSubscriptions;
    let func;
    if(type === 'add'){
      func = mergeUnique;
      updateSubscriptionNumber(subscription, 1);
    } else {
      func = removeArr;
      updateSubscriptionNumber(subscription, -1);
    }
    if(subscriptions.new){
      dispatch(closeStream(secondaryStream));
      newSubscriptions = func(subscriptions.new, subscription);
    } else {
      newSubscriptions = func(subscriptions.old, subscription);
    }
    clearTimeout(timeout);
    if(newSubscriptions.length > 0){
      subscriptions.new = newSubscriptions;
      timeout = setTimeout(() => {
        const ws = dispatch(openStream({ name: secondaryStream, subscription: newSubscriptions, full: false }, null, options));
        ws.addEventListener('open', () => {
          dispatch(closeStream(mainStream, true));
          dispatch(updateReduxStream(mainStream, null, null, ws, { subscription: newSubscriptions, name: mainStream, full: false }));
          subscriptions.old = subscriptions.new;
          subscriptions.new = null;
        });
      }, 500);
    } else {
      timeout = setTimeout(() => {
        dispatch(closeStream(mainStream));
        subscriptions.old = null;
        subscriptions.new = null;
      }, 500);
    }
  }
}

export function getServiceUrl(service, options){
  const version = options && options.hasOwnProperty('version') ? options.version : getServiceVersion(service);
  return config.baseUrl + (version ? '/' + version : '') + '/' + service;
}

export function matchObject(obj1, obj2) {
  for (const key in obj2) {
    if(obj1.hasOwnProperty(key)){
      let left = obj1[key];
      let right = obj2[key];
      if (left && right && left.constructor !== right.constructor) {
        return false;
      } else if (typeof(left) === "object") {
        if (!matchObject(left, right)) {
          return false;
        }
      } else if (left !== right) {
        return false;
      }
    } else {
      return false;
    }
  }
  return true;
}
