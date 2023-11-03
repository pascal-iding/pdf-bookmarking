/**
 * @file view.js
 * @summary This file contains the view object which is responsible for managing the view of the pdf bookmark extension.
 * @description The view object contains methods for updating the view of the pdf bookmark extension. All changes to the view
 * should be made through the view object.
 * @typedef {Object} view - The view object which is responsible for managing the view of the pdf bookmark extension.
 * @property {Object} data - An object that stores global state variables.
 * @property {Object} methods - An object that contains methods for updating the view of the pdf bookmark extension.
 * @property {Object} $methods - An object that contains private methods.
 * @property {Object} data.html - An object that stores references to often used html elements.
 */


const view = {
    data: {
        html: {
            title: document.getElementById('title'),
            title_input: document.getElementById('new-bookmark-title'),
            add_bookmark_button: document.getElementById('add-bookmark-button'),
            new_bookmark_page_input: document.getElementById('new-bookmark-page'),
            delete_all_button: document.getElementById('delete-all-button'),
            bookmarks_list: document.getElementById('bookmarks-list'),
            search_input: document.getElementById('search-input'),
            error_message: document.getElementById('error-message'),
        }
    },
    methods: {
        set_error_message: function(message){
            view.data.html.error_message.innerHTML = message
            view.data.html.error_message.classList.remove('hide')
        },
        set_window_title: function(title){
            // Set title of the window (Name of the Pdf)
            view.data.html.title.innerHTML = title
        },
        get_title_input: function(){
            // Get title of the input for creating new bookmarks
            return view.data.html.title_input.value
        },
        set_title_input: function(title){
            // Set title of the input for creating new bookmarks
            view.data.html.title_input.value = title
        },
        set_page_input: function(page){
            // Set page of the input for creating new bookmarks
            view.data.html.new_bookmark_page_input.value = page
        }, 
        get_page_input: function(){
            // Get page of the input for creating new bookmarks
            return parseInt(view.data.html.new_bookmark_page_input.value)
        },
        set_delete_all_button_text: function(text){
            view.data.html.delete_all_button.innerHTML = text
        },
        delete_all_button_add_class: function(class_name){
            view.data.html.delete_all_button.classList.add(class_name)
        },
        delete_all_button_remove_class: function(class_name){
            view.data.html.delete_all_button.classList.remove(class_name)
        },
        set_element_hide: function(element, hide=true){
            if(hide){
                element.classList.add('hide')
            } else {
                element.classList.remove('hide')
            }
        },
        set_input_readonly: function(input, readonly=true){
            input.readOnly = readonly
        },
        draw_bookmarks: function(bookmarks, use_url_seperator=false){
            view.$methods.empty_bookmark_list();
            let url = null;
            for(let bookmark of bookmarks) {
                if (use_url_seperator && bookmark.url !== url) {
                    url = bookmark.url;
                    let divider = `
                        <div class="divider-container" style="display: flex; flex-direction: column; gap: 5px;">
                            <div class="divider">${url}</div>
                            <div class="change-url-container hide">
                                <div class="url-change-field">
                                    <input autocomplete="off" class="input" type="text" placeholder="Url: ${url}" data-url="${url}">
                                    <button class="url-accept-button accept"><i class="fa fa-check url-accept-button"></i></button>
                                </div>
                            </div>
                        </div>
                    `
                    document.getElementById('bookmarks-list').insertAdjacentHTML('beforeend', divider);
                }
                let bookmark_html = view.$methods.get_bookmark_html(bookmark);
                document.getElementById('bookmarks-list').insertAdjacentHTML('beforeend', bookmark_html);
            }
        },
        set_search_input: function(search_term){
            view.data.html.search_input.value = search_term
        },
        reset_divider_visibility(element){
            // Sets the visibility of a change-url-container (element) to hidden
            let input = element.closest(".divider-container").querySelector('.input');
            input.value = ''
            view.methods.set_element_hide(element, true);
        }
    },
    $methods: {
        get_bookmark_html: function(bookmark){
            return  `
                <div class="bookmark" id="${bookmark.timestamp}" data-url="${bookmark.url}">
                    <div class="bookmark-title">
                        <input type="text" readonly="readonly" class="input input-bright" value="${bookmark.title}">
                        <div class="bookmark-actions">
                            <button class="accept-button accept hide"><i class="fa fa-check accept-button"></i></button>
                            <button class="edit-button"><i class="fa fa-pencil"></i></button>
                            <button class="delete-button"><i class="fa fa-trash"></i></button>
                        </div>
                    </div>
                    <input type="number" class="number" value="${bookmark.page}">
                </div>
            `
        },
        empty_bookmark_list: function(){
            view.data.html.bookmarks_list.innerHTML = ""
        },  
    }
}