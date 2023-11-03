/** 
 * @file controller.js
 * @summary This file contains the controller object which is responsible for managing the controller of the pdf bookmark extension.
 * @description The controller is responsible for receiving and processing user input, coordinating interactions between
 * the model and view and controlling the flow of the application.
 * @typedef {Object} controller - The controller object which is responsible for managing the controller of the pdf bookmark extension.
 * @property {Object} data - An object that stores global state variables.
 * @property {Object} methods - An object that contains the starting point of the application logic(setup()).
 * @property {Object} $methods - An object that contains private methods.
 * @property {Object} data.html - An object that stores references to often used html elements.
 * @property {Object} data.mode - An object that stores the current mode of the extension.
 * @property {Object} data.mode.value - The current mode of the extension can have the values 'current' or 'all'.
 * In the mode 'current' the extension only shows bookmarks of the currently opened pdf. In the mode 'all' the extension
 * shows all bookmarks in the storage grouped by url.
 * @property {Object} data.mode.fixed - If true, the user can't switch the active mode. This is neccessary if the current url is not a pdf.
 * @property {Object} data.delete_all_state - If true, the user has clicked the delete all button and needs to confirm the action by
 * clicking the button again. If the user clicks anywhere else, the state gets reset.
*/


const controller = {
    data: {
        mode: {
            value: 'current', 
            fixed: false
        }, 
        title: null,
        url: null,
        delete_all_state: false, 
        html: {
            title_input: document.getElementById('title'),
            add_bookmark_button: document.getElementById('add-bookmark-button'),
            new_bookmark_page_input: document.getElementById('new-bookmark-page'),
            delete_all_button: document.getElementById('delete-all-button'),
            bookmarks_list: document.getElementById('bookmarks-list'),
            current_link: document.getElementById('mode-current'),
            all_link: document.getElementById('mode-all'),
            search_input: document.getElementById('search-input'),
            new_bookmark_field: document.getElementById('new-bookmark-field'),
            error_message: document.getElementById('error-message'),
        }
    },
    methods: {
        setup: function(){
            // A singleton that is the first function that is called after the DOM content is loaded.
            let setup_already_called = typeof setup_called !== 'undefined';
            if(setup_already_called) {
                console.error("Setup already called")
                return
            }
            setup_called = true;

            controller.$methods.init_data()
                .then(function(){
                    controller.$methods.init_bookmark_add_button()
                    controller.$methods.init_delete_all_button()
                    controller.$methods.init_reset_delete_all_listener()
                    controller.$methods.init_bookmark_list_click_events()
                    controller.$methods.init_bookmark_list_input_events()
                    
                    controller.data.html.current_link.addEventListener('click', function(event) {
                        // If user click link to switch to current mode
                        controller.$methods.switch_mode('current');
                    });

                    controller.data.html.all_link.addEventListener('click', function(event) {
                        // If user click link to switch to all mode
                        controller.$methods.switch_mode('all');
                    });

                    controller.data.html.search_input.addEventListener('input', function(event) {
                        // If user types in search input
                        controller.$methods.draw_bookmarks(event.target.value);
                    });

                    controller.data.html.error_message.addEventListener('click', function(event) {
                        view.methods.set_element_hide(controller.data.html.error_message, true);
                    });

                    controller.$methods.draw_bookmarks()
                }).catch(function(error){
                    view.methods.set_error_message(error)
                });
            
        }
    },
    $methods: {
        sort_bookmarks_by_url: function(bookmarks){
            // Sorts an array of bookmarks by url
            bookmarks.sort((a, b) => {
                const urlA = a.url.toLowerCase();
                const urlB = b.url.toLowerCase();

                if (urlA < urlB) return -1;
                if (urlA > urlB) return 1;

                return 0;
            });
        },
        draw_bookmarks: function(search_term=""){
            // Draw bookmarks in the bookmarks list
            let mode_is_current = controller.data.mode.value == 'current';
            if(mode_is_current) {
                model.methods.get_all_bookmarks(search_term, controller.data.url)
                    .then(function(bookmarks){
                        view.methods.draw_bookmarks(bookmarks);
                    }).catch(function(error){
                        view.methods.set_error_message(error)
                    });
                return
            }
            model.methods.get_all_bookmarks(search_term)
                .then(function(bookmarks){
                    controller.$methods.sort_bookmarks_by_url(bookmarks);
                    view.methods.draw_bookmarks(bookmarks, use_url_seperator=true);
                }).catch(function(error){
                    view.methods.set_error_message(error)
                });
                return
        },
        init_data: function(){
            // Initialises controller.data.url and controller.data.title
            return new Promise(function(resolve, reject) {
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
                    if (chrome.runtime.lastError) {
                        // Reject the Promise with an error if there's an issue
                        reject(chrome.runtime.lastError);
                        return;
                    }
                    let url = tabs[0].url.split('#')[0];
                    let title = controller.$methods.get_pdf_title_from_url(url);
    
                    controller.data.url = url;
    
                    if(!title) {
                        // If the current url is not a pdf, disable the 'current' mode
                        controller.$methods.disable_mode_current();
                        resolve();
                        return
                    }
                    controller.data.title = title;
                    view.methods.set_window_title(title);
                    resolve();
                    return;
                });
            });
        },
        get_pdf_title_from_url: function(url, tail='.pdf'){
            const decodedUrl = decodeURIComponent(url);
            const matches = decodedUrl.match(/\/([^/]+)\.pdf$/i);

            if (matches) {
                let title = matches[1].replace(/%20/g, ' ') + tail;
                return title;
            } else {
                return null;
            }
        },
        disable_mode_current: function(){
            // If the current url is not a pdf, disable the 'current' mode
            view.methods.set_element_hide(controller.data.html.new_bookmark_field, true);
            controller.$methods.switch_mode('all');
            controller.data.mode.fixed = true;
        },
        init_bookmark_add_button: function(){
            controller.data.html.add_bookmark_button.addEventListener('click', function(event) {
                // Save a new bookmark
                event.preventDefault();

                let title = view.methods.get_title_input();
                let page = view.methods.get_page_input();
                let url = controller.data.url;

                model.methods.create_bookmark(title, url, page)
                    .then(function(){
                        controller.$methods.draw_bookmarks();
                        view.methods.set_search_input('');
                        view.methods.set_title_input('');
                    }).catch(function(error){
                        console.error(error)
                    });
            });
        },
        init_delete_all_button: function(){
            document.getElementById('delete-all-button').addEventListener('click', function(event) {
                if (controller.data.delete_all_state === false) {
                    controller.data.delete_all_state = true;
                    view.methods.delete_all_button_add_class('danger');
                    view.methods.set_delete_all_button_text('Confirm');
                    return
                }
                controller.data.delete_all_state = false;
                view.methods.delete_all_button_remove_class('danger');
                view.methods.set_delete_all_button_text('Delete all');
                if(controller.data.mode.value == 'current') {
                    model.methods.delete_all_bookmarks(controller.data.url)
                        .then(function(){
                            controller.$methods.draw_bookmarks();
                        }).catch(function(error){
                            view.methods.set_error_message(error)
                        });
                    return
                }
                model.methods.delete_all_bookmarks()
                    .then(function(){
                        controller.$methods.draw_bookmarks();
                    }).catch(function(error){
                        console.error(error)
                    });
            });
        },
        init_reset_delete_all_listener: function(){
            // If the user clicks outside the delete all button, reset the state if it's active
            document.addEventListener('click', function(event) {
                let is_delete_all_button = event.target.id == 'delete-all-button';
                if (!is_delete_all_button) {
                    controller.data.delete_all_state = false;
                    view.methods.delete_all_button_remove_class('danger');
                    view.methods.set_delete_all_button_text('Delete all');
                }
            })
        },
        init_bookmark_list_click_events: function(){
            controller.data.html.bookmarks_list.addEventListener('click', function(event) {
                let is_delete_button = event.target.classList.contains('delete-button') || event.target.classList.contains('fa-trash');
                let is_link = event.target.tagName.toLowerCase() === 'input' && event.target.type === 'text' && event.target.readOnly;
                let is_edit_button = event.target.classList.contains('edit-button') || event.target.classList.contains('fa-pencil');
                let is_accept_button = event.target.classList.contains('accept-button');
                let is_divider = event.target.classList.contains('divider');
                let is_url_change_accept_button = event.target.classList.contains('url-accept-button');

                // The button to accept changes made to a bookmark title
                if (is_accept_button) {
                    // The input to edit the bookmark title of the bookmark that is being edited
                    let input = event.target.closest('.bookmark').querySelector('.input');
                    let edit_button = event.target.closest('.bookmark').querySelector('.edit-button');
                    let accept_button = event.target.closest('.bookmark').querySelector('.accept');
                    let timestamp = event.target.closest('.bookmark').id;

                    model.methods.update_bookmark_title(timestamp, input.value)
                        .then(function(){
                            input.readOnly = true;
                            view.methods.set_element_hide(accept_button, true);
                            view.methods.set_element_hide(edit_button, false);
                            controller.$methods.draw_bookmarks();
                            return
                        }).catch(function(error){
                            input.readOnly = true;
                            view.methods.set_element_hide(accept_button, true);
                            view.methods.set_element_hide(edit_button, false);
                            controller.$methods.draw_bookmarks();
                            view.methods.set_error_message(error)
                            return
                        });
                    return
                }
                if (is_edit_button) {
                    // The button to edit a bookmark title
                    let title_input = event.target.closest('.bookmark').querySelector('.input');
                    let edit_button = event.target.closest('.bookmark').querySelector('.edit-button');
                    let accept_button = event.target.closest('.bookmark').querySelector('.accept');

                    controller.data.html.bookmarks_list.querySelectorAll('.bookmark-title .input').forEach(function(input) {
                        // Reset all inputs to non editable
                        view.methods.set_input_readonly(input, true);
                        view.methods.set_element_hide(input.closest('.bookmark-title').querySelector('.edit-button'), false);
                        view.methods.set_element_hide(input.closest('.bookmark-title').querySelector('.accept'), true);
                    });
                    // Set the current input to editable
                    view.methods.set_input_readonly(title_input, false);
                    view.methods.set_element_hide(edit_button, true);
                    view.methods.set_element_hide(accept_button, false);

                    return
                }
                if (is_delete_button) {
                    let bookmark = event.target.closest('.bookmark');
                    let timestamp = bookmark.id;

                    model.methods.delete_bookmark(timestamp)
                        .then(function(){
                            // TODO success message?
                            controller.$methods.draw_bookmarks();
                        }).catch(function(error){
                            view.methods.set_error_message(error)
                            console.error(error)
                        });
                    return
                }
                if(is_link) {
                    // If the user clicks on the bookmark title, open the bookmarked pdf at specified page
                    let page = event.target.closest('.bookmark').querySelector('.number').value;
                    let href = null;

                    let is_mode_current = controller.data.mode.value == 'current';
                    if (is_mode_current) {
                        href = controller.data.url + '#page=' + page;
                    }else{
                        let url = event.target.closest('.bookmark').dataset.url;
                        href = url + '#page=' + page;
                    }
                    chrome.tabs.create({url: href});
                    return
                }
                if(is_divider){
                    let divider = event.target;
                    let change_url_container = divider.closest(".divider-container").querySelector('.change-url-container');

                    if (change_url_container.classList.contains('hide')) {
                        document.querySelectorAll('.change-url-container').forEach(function(element) {
                            view.methods.reset_divider_visibility(element);
                        });
                        view.methods.set_element_hide(change_url_container, false);
                        return
                    }
                    view.methods.set_element_hide(change_url_container, true);
                }
                if(is_url_change_accept_button){
                    let button = event.target;
                    let input = button.closest(".url-change-field").querySelector('.input');
                    let old_url = input.dataset.url;
                    let change_url_container = button.closest('.divider-container').querySelector('.change-url-container');

                    let new_url_empty = input.value == '';
                    if(new_url_empty) {
                        input.value = ''
                        view.methods.set_element_hide(change_url_container, true);
                        return
                    }

                    model.methods.update_bookmark_url(old_url, input.value)
                        .then(function(){
                            // TODO success message
                            controller.$methods.draw_bookmarks();
                            input.value = ''
                            view.methods.set_element_hide(change_url_container, true);
                        }).catch(function(error){
                            view.methods.set_error_message(error)
                            console.error(error)
                        })
                }
            });
        },
        init_bookmark_list_input_events: function(){
            // If the user changes the page of a bookmark, update the bookmark to the new page
            controller.data.html.bookmarks_list.addEventListener('input', function(event) {
                let page_input = event.target;

                let is_page_input = event.target.classList.contains('number');
                if (!is_page_input) {
                    return
                }
                let new_page = parseInt(event.target.value);
                let timestamp = event.target.closest('.bookmark').id;

                page_input.disabled = true;
                
                model.methods.update_bookmark_page(timestamp, new_page)
                    .then(function(){
                        // TODO success message
                        page_input.disabled = false;
                    }).catch(function(error){
                        view.methods.set_error_message(error)
                        page_input.disabled = false;
                    })
            }); 
        },
        switch_mode: function(mode){
            if (controller.data.mode.fixed) return;
            controller.data.mode.value = mode;
            view.methods.set_search_input('');
            if (mode == 'current') {
                controller.data.html.current_link.classList.add('coffee');
                controller.data.html.all_link.classList.remove('coffee');
                controller.$methods.draw_bookmarks();
            } else if (mode == 'all') {
                controller.data.html.current_link.classList.remove('coffee');
                controller.data.html.all_link.classList.add('coffee');
                controller.$methods.draw_bookmarks();
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", function(event) { 
    // code to be executed when the document is ready
    controller.methods.setup();
});
