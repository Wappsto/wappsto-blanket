import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { setItem } from 'wappsto-redux/actions/items';
import { makeRequest } from 'wappsto-redux/actions/request';

import { makeEntitiesSelector } from 'wappsto-redux/selectors/entities';
import { makeItemSelector } from 'wappsto-redux/selectors/items';
import { getUrlInfo } from 'wappsto-redux/util/helpers';

import usePrevious from '../hooks/usePrevious';
import useRequest from '../hooks/useRequest';

function getQueryObj(query) {
	var urlParams = {};
  var match,
      pl     = /\+/g,
      search = /([^&=]+)=?([^&]*)/g,
      decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); };

  while ((match = search.exec(query)))
     urlParams[decode(match[1])] = decode(match[2]);
	return urlParams;
}

/*
props: url, type, id, childType, query, reset, resetOnEmpty, sort
*/
const empty = [];
function useList(props){
  const dispatch = useDispatch();
	const prevQuery = usePrevious(props.query);
	const query = useRef({});
	const differentQuery = useRef(0);
	if(JSON.stringify(prevQuery) !== JSON.stringify(props.query)){
		differentQuery.current = differentQuery.current + 1;
	}

	const propsData = useMemo(() => {
		let { type, id, childType, url } = props;
	  let parent, entitiesType;
	  let query = { ...props.query };
	  if(url){
	    let split = url.split("?");
	    url = split[0];
	    query = {...getQueryObj(split.slice(1).join("?")), ...query};
	    split = split[0].split("/");
			let result = getUrlInfo(url);
			if(result.parent){
				type = result.parent.type;
		    childType = result.service;
		    entitiesType = childType;
			} else {
				id = result.id;
				type = result.service;
				entitiesType = type;
			}
	  } else {
	    url = "/" + type;
	    if(id){
	      if(id.startsWith("?")){
	        query = { ...query, ...getQueryObj(id.slice(1)) };
	      } else {
	        if(!id.startsWith("/")){
	          url += "/";
	        }
	        url += id;
	      }
	    }
	    if(childType){
	      url += "/" + childType;
	      parent = { id, type };
	      entitiesType = childType;
	    } else {
	      entitiesType = type;
	    }
	  }
		if(!query.limit || query.limit > 100){
			query.limit = 100;
		}
		return{
			type: type,
			childType: childType,
			entitiesType: entitiesType,
			id: id,
			url: url,
			query: query,
			parent: parent
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.type, props.id, props.childType, props.url, differentQuery.current]);

	const { request, setRequestId } = useRequest();
	const queryString = JSON.stringify(propsData.query);
	const idsItemName = propsData.url + queryString + "_ids";
	const fetchedItemName = propsData.url + queryString + "_fetched";
	const getSavedIdsItem = useMemo(makeItemSelector, []);
	const savedIds = useSelector(state => getSavedIdsItem(state, idsItemName)) || [];
	const getFetchedItem = useMemo(makeItemSelector, []);
	const fetched = useSelector(state => getFetchedItem(state, fetchedItemName));

	const limit = propsData.query.limit;

	const options = { parent: propsData.parent, filter: savedIds, limit: savedIds.length };

	const getEntities = useMemo(makeEntitiesSelector, []);
	let items = useSelector(state => getEntities(state, propsData.entitiesType, options));

	if(props.resetOnEmpty){
		if(!fetched
			&& items.length !== 0
			&& (!request
					|| request.status === "error"
					|| (request.status === "pending" && !request.url.includes("offset") && !request.options.query.hasOwnProperty("offset"))
				)
		) {
			items = empty;
		}
	}
	if(items.length === 1 && items[0].meta.type === 'attributelist'){
		const newItems = [];
		for(let key in items[0].data){
			newItems.push({id: key, [propsData.id]: items[0].data[key]});
		}
		items = newItems.length > 0 ? newItems : empty;
	}

	const [ canLoadMore, setCanLoadMore ] = useState(items.length % limit === 0);

	useEffect(() => {
		items.sort(props.sort);
	}, [items, props.sort]);

	const prevRequest = usePrevious(request);

  const sendRequest = useCallback((options) => {
		if(propsData.url){
			setCanLoadMore(false);
			setRequestId(dispatch(makeRequest("GET", propsData.url, null, options)));
		}
  }, [dispatch, propsData.url, setRequestId]);

  const refresh = useCallback((reset) => {
		query.current = {
			expand: 0,
			...propsData.query
		};
    sendRequest({
      query: query.current,
      reset: (typeof reset === "boolean") ? reset : true,
			refresh: true
    });
  }, [propsData.query, sendRequest]);

  useEffect(() => {
		if((!fetched && (!request || request.status !=='pending')) || (fetched && request && request.status === "error")){
			dispatch(setItem(fetchedItemName, true));
			refresh(props.reset);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propsData.query, props.id, propsData.url, refresh, fetched]);

  // function updateItemCount
  useEffect(() => {
    if(prevRequest && prevRequest.status === "pending" && request && request.status === "success"){
      dispatch(setItem(idsItemName, (ids) => {
				if(request.options.refresh){
					ids = [];
				}
				if(request.json.constructor === Array){
					ids = [...ids, ...request.json.map(item => ({ meta: { id: item.meta.id }}))];
				} else if(request.json.meta.type === 'attributelist'){
					ids = [propsData.id];
				}
				return ids;
			}));
    }
  }, [dispatch, idsItemName, prevRequest, propsData.id, request]);

  // function updateListLoadMore
  useEffect(() => {
    if(request && prevRequest && prevRequest.status !== "success" && request.status === "success"){
			let data;
			if(request.json.constructor === Array){
				data = request.json;
			} else if(request.json.meta.type === 'attributelist'){
				data = Object.keys(request.json.data);
			} else {
				data = [request.json];
			}
      if(data.length === limit){
        setCanLoadMore(true);
      } else {
        setCanLoadMore(false);
      }
    }
  }, [limit, prevRequest, request]);

  const loadMore = useCallback(() => {
		if(canLoadMore){
			query.current = {
				expand: 0,
				...propsData.query,
				offset: items.length + (propsData.query.offset || 0)
			};
      sendRequest({
        query: query.current
      });
    }
	}, [canLoadMore, propsData.query, items.length, sendRequest]);

	const addItem = useCallback((id, position='start') => {
		const found = savedIds.find(obj => obj.meta.id === id);
		if(!found){
			dispatch(setItem(idsItemName, (ids = []) => {
				if(position==='start'){
					return [{ meta: { id }}, ...ids];
				} else {
					return [...ids, { meta: { id }}];
				}
			}));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dispatch, idsItemName]);

  return { items, canLoadMore, request, refresh, loadMore, addItem };
}

export default useList;
