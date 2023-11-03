
/**
 * @file model.js
 * @summary This file contains the model object which is responsible for managing the data of the pdf bookmark extension.
 * @description This file contains the model object which is responsible for managing the data of the pdf bookmark extension. 
 * The model object contains methods for creating, updating, deleting and retrieving bookmarks from the chrome storage.
 * @typedef {Object} model - The model object which is responsible for managing the data of the pdf bookmark extension.
 * @property {Object} data - An object that stores global state variables.
 * @property {Object} methods - An object that contains methods for creating, updating, deleting and retrieving bookmarks from the chrome storage.
 * @property {Object} $methods - An object that contains private methods.
 */


const model = {
    data: {
        
    },
    methods: {
        update_bookmark_page: function(timestamp, page){
            let validation_error = null;

            let is_new_page_positive_integer = Number.isInteger(page) && page > 0;
            if (!is_new_page_positive_integer) {
                validation_error = 'Page must be a positive integer greater than 0';
            }

            return new Promise(function(resolve, reject) {
                if (validation_error) {
                    reject(validation_error);
                    return;
                }
                chrome.storage.sync.get(timestamp, function(result) {
                    if (chrome.runtime.lastError) {
                        // Reject the Promise with an error if there's an issue
                        reject(chrome.runtime.lastError);
                        return;
                    }
                    chrome.storage.sync.set({ [timestamp]: {
                        page: page,
                        timestamp: result[timestamp].timestamp,
                        title: result[timestamp].title,
                        url: result[timestamp].url
                    }}, function(){
                        if (chrome.runtime.lastError) {
                            // Reject the Promise with an error if there's an issue
                            reject(chrome.runtime.lastError);
                            return;
                        }
                        resolve();
                        return;
                    });
                });
            })
        },
        update_bookmark_title: function(timestamp, title){
            let validation_error = null;

            let valid_title = typeof title === 'string' && title.trim() !== '';
            if (!valid_title) {
                validation_error = 'Title must be a non-empty string';
            }

            title = title.trim()

            return new Promise(function(resolve, reject) {
                if (validation_error) {
                    reject(validation_error);
                    return;
                }
                chrome.storage.sync.get(timestamp, function(result) {
                    if (chrome.runtime.lastError) {
                        // Reject the Promise with an error if there's an issue
                        reject(chrome.runtime.lastError);
                        return;
                    }
                    chrome.storage.sync.set({ [timestamp]: {
                        page: result[timestamp].page,
                        timestamp: result[timestamp].timestamp,
                        title: title,
                        url: result[timestamp].url
                    }}, function(){
                        if (chrome.runtime.lastError) {
                            // Reject the Promise with an error if there's an issue
                            reject(chrome.runtime.lastError);
                            return;
                        }
                        resolve();
                        return;
                    });
                });
            })
        },
        update_bookmark_url: function(old_url, new_url){
            return new Promise(function(resolve, reject) {
                chrome.storage.sync.get(null, function(bookmarks){
                    if (chrome.runtime.lastError) {
                        // Reject the Promise with an error if there's an issue
                        reject(chrome.runtime.lastError);
                        return;
                    }
                    
                    for(let timestamp in bookmarks){
                        let bookmark = bookmarks[timestamp]
                        if(bookmark.url == old_url){
                            chrome.storage.sync.set({ [timestamp]: {
                                page: bookmark.page,
                                timestamp: bookmark.timestamp,
                                title: bookmark.title,
                                url: new_url
                            }}, function(){
                                if (chrome.runtime.lastError) {
                                    // Reject the Promise with an error if there's an issue
                                    reject(chrome.runtime.lastError);
                                    return;
                                }
                                resolve();
                                return;
                            });
                        }
                    }
                })
            })
        },
        get_all_bookmarks: function(search_term="", url=""){
            // Returns all bookmarks that match the search parameters
            return new Promise(function(resolve, reject) {
                chrome.storage.sync.get(null, function(bookmarks){
                    if (chrome.runtime.lastError) {
                        // Reject the Promise with an error if there's an issue
                        reject(chrome.runtime.lastError);
                        return;
                    }

                    let bookmarks_array = []
                    for(let timestamp in bookmarks){
                        let bookmark = bookmarks[timestamp]

                        let bookmark_contains_search_term = bookmark.title.toLowerCase().includes(search_term.toLowerCase())
                        if(!bookmark_contains_search_term){
                            continue
                        }

                        let bookmark_has_url = bookmark.url.toLowerCase() == url.toLowerCase()
                        if(url && !bookmark_has_url){
                            continue
                        }

                        bookmarks_array.push(bookmark)
                    }
                    resolve(bookmarks_array)
                    return;
                })
            
            })
        },
        delete_all_bookmarks: function(url=null){
            if(!url){
                return new Promise(function(resolve, reject) {
                    chrome.storage.sync.clear(function() {
                        if (chrome.runtime.lastError) {
                            // Reject the Promise with an error if there's an issue
                            reject(chrome.runtime.lastError);
                            return;
                        }
                        resolve();
                        return;
                    });
                })
            }
            
        },
        delete_bookmark: function(timestamp){
            return new Promise(function(resolve, reject) {
                chrome.storage.sync.remove(timestamp.toString(), function() {
                    if (chrome.runtime.lastError) {
                        // Reject the Promise with an error if there's an issue
                        reject(chrome.runtime.lastError);
                        return;
                    }
                    resolve();
                    return;
                });
            })
        },
        create_bookmark: function(title, url, page){
            const timestamp = new Date().getTime();
            let validation_error = null;

            let valid_title = typeof title === 'string' && title.trim() !== '';
            if (!valid_title) {
                validation_error = 'Title must be a non-empty string';
            }

            let valid_url = typeof url === 'string' && url !== '';
            if (!valid_url) {
                validation_error = 'URL must be a non-empty string';
            }

            let valid_page = Number.isInteger(page) && page > 0;
            if (!valid_page) {
                validation_error = 'Page must be a positive integer greater than 0';
            }

            title = title.trim();

            return new Promise(function(resolve, reject) {
                if (validation_error) {
                    reject(validation_error);
                    return;
                }
                chrome.storage.sync.set({ [timestamp]: {
                    title: title,
                    page: page,
                    url: url,
                    timestamp: timestamp
                }}, function(){
                    if (chrome.runtime.lastError) {
                        // Reject the Promise with an error if there's an issue
                        reject(chrome.runtime.lastError);
                        return;
                    }
                    resolve();
                    return;
                });
            })
        }
    },
    $methods: {

    }
}
