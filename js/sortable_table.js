sorttable = {
    init: function () {
        // don't do the same thing twice
        if (arguments.callee.done)
            return;        
        arguments.callee.done = true;
      
        sorttable.DATE_RE = /^(\d\d?)[\/\.-](\d\d?)[\/\.-]((\d\d)?\d\d)$/;
        $.each($("table"), function (i, table) {
            if ($(table).hasClass("sortable") == true) { 
                sorttable.makeSortable(table);
            }
        });
    },

    makeSortable: function (table) {
        var tblid = "#" + $(table).attr("id"); 
        // create thead if do not have one       
        if ($(tblid + ".sortable > thead").length == 0) {
            $(tblid + ".sortable").prepend("<thead><tr>" + $(tblid + ".sortable").find("tr:eq(0)").html() + "</tr></thead>");
            $(tblid + ".sortable").find(" tbody tr:eq(0)").remove();            
        }       

        // make sure no two header rows 
        if ($(tblid + ".sortable > thead > tr").length != 1) {            
            return;  
        }                

        //display default sort icon
        var $headrowth = $(tblid + ".sortable > thead > tr > th");      
        var $lastth = $headrowth.last();
        if ($lastth.find("div:first").length)
            $lastth.find("div").append("<span style='font-size:16px' id='sorttable_sortfwdind'>&nbsp;&#x25B4;</span>");
        else
            $lastth.append("<span style='font-size:16px' id='sorttable_sortfwdind'>&nbsp;&#x25B4;</span>");       

        $lastth.removeClass("sorttable_sorted_reverse").addClass("sorttable_sorted"); 

        // work through each column and calculate its type if it is clicked or not
        $.each($headrowth, function (i, rowth) {
            // skip this col, so if you want to some column not sortable put class 'sorttable_nosort'
            if (!($(rowth).hasClass("sorttable_nosort"))) {
                var mtch = $(rowth).hasClass("sorttable_([a-z0-9]+)");
                if (mtch) {
                    override = mtch[1];
                }
                if (mtch && typeof sorttable["sort_" + override] == 'function') {
                    rowth.sorttable_sortfunction = sorttable["sort_" + override];
                } else {
                    rowth.sorttable_sortfunction = sorttable.guessType(table, i);
                }
               
                rowth.sorttable_columnindex = i;
                rowth.sorttable_tbody = table.tBodies[0]; 
               
                $(rowth).click(function (e) {
                    if ($(rowth).hasClass("sorttable_sorted")){                        
                        sorttable.reverse(rowth.sorttable_tbody);                       
                        $(rowth).removeClass("sorttable_sorted").addClass("sorttable_sorted_reverse");
                        $(tblid + " #sorttable_sortfwdind").remove();  
                        if ($(rowth).find("div:first").length)
                            $(rowth).find("div").append("<span style='font-size:16px' id='sorttable_sortrevind'>&nbsp;&#x25BE;</span>");
                        else
                            $(rowth).append("<span style='font-size:16px' id='sorttable_sortrevind'>&nbsp;&#x25BE;</span>");
                        return;
                    }
                    if ($(rowth).hasClass("sorttable_sorted_reverse")) {                        
                        sorttable.reverse(rowth.sorttable_tbody);
                        $(rowth).removeClass("sorttable_sorted_reverse").addClass("sorttable_sorted");                       
                        $(tblid + " #sorttable_sortrevind").remove(); 
                        if ($(rowth).find("div:first").length)
                            $(rowth).find("div").append("<span style='font-size:16px' id='sorttable_sortfwdind'>&nbsp;&#x25B4;</span>");
                        else
                            $(rowth).append("<span style='font-size:16px' id='sorttable_sortfwdind'>&nbsp;&#x25B4;</span>");
                        return;
                    }
                   
                    var $trth = $(tblid + ".sortable > thead > tr > th");
                    $.each($trth, function (jj, theth) {
                        if ($(theth).hasClass("sorttable_sorted_reverse"))
                            $(theth).removeClass("sorttable_sorted_reverse");

                        if ($(theth).hasClass("sorttable_sorted"))
                            $(theth).removeClass("sorttable_sorted");
                    });

                    $(tblid + " #sorttable_sortfwdind").remove();
                    $(tblid + " #sorttable_sortrevind").remove();
                   
                    var cname = '';
                    if ($(rowth).attr("class"))
                        cname = $(rowth).attr("class");                   
                    cname += ' sorttable_sorted';
                    $(rowth).attr("class", cname);

                    if ($(rowth).find("div:first").length) {
                        var trimed = $.trim($(rowth).find("div").html());
                        trimed = trimed.replace(/\s+/g, '');
                        var count = 0;
                        if (trimed.match(/▴/g))
                            count = trimed.match(/▴/g).length;
                        if (count == 0)
                            $(rowth).find("div").append("<span style='font-size:16px' id='sorttable_sortfwdind'>&nbsp;&#x25BE;</span>");
                    }
                    else {
                        var trimed = $.trim($(rowth).html());
                        trimed = trimed.replace(/\s+/g, '');
                        var count = 0;
                        if (trimed.match(/▴/g))
                            count = trimed.match(/▴/g).length;
                        if (count == 0)
                            $(rowth).append("<span style='font-size:16px' id='sorttable_sortfwdind'>&nbsp;&#x25BE;</span>");
                    } 

                    var row_array = [];
                    var col = rowth.sorttable_columnindex;
                    var rows = rowth.sorttable_tbody.rows;
                    for (var j = 0; j < rows.length; j++) {
                        row_array[row_array.length] = [sorttable.getInnerText(rows[j].cells[col]), rows[j]];
                    }

                    row_array.sort(rowth.sorttable_sortfunction);                    
                    //row_array.reverse();  //uncomment it for descending order first
                    var tb = rowth.sorttable_tbody;
                    for (var j = 0; j < row_array.length; j++) {
                        tb.appendChild(row_array[j][1]);
                    }
                    delete row_array;
                });                
            }
        });
    },

    guessType: function(table, column) {
        // guess the type of a column based on its first non-blank row
        var sortfn = sorttable.sort_alpha;
        for (var i=0; i<table.tBodies[0].rows.length; i++) {
            var text = sorttable.getInnerText(table.tBodies[0].rows[i].cells[column]);
            if (text != '') {
                if (text.match(/^-?[£$¤]?[\d,.]+%?$/)) {
                    return sorttable.sort_numeric;
                }
                // check for a date: dd/mm/yyyy or dd/mm/yy, can have / or . or - as separator, and can be mm/dd as well
                var possdate = text.match(sorttable.DATE_RE)
                if (possdate) {
                    // looks like a date
                    var first = parseInt(possdate[1]);
                    var second = parseInt(possdate[2]);
                    if (first > 12) {                       
                        return sorttable.sort_ddmm;  // definitely dd/mm
                    } else if (second > 12) {
                        return sorttable.sort_mmdd;
                    } else {
                        // looks like a date, but we can't tell which, so assume that it's dd/mm (English imperialism!) and keep looking
                        sortfn = sorttable.sort_ddmm;
                    }
                }
            }
        }
        return sortfn;
    },

    getInnerText: function(node) {
        // gets the text we want to use for sorting for a cell. strips leading and trailing whitespace.
        // this is *not* a generic getInnerText function; it's special to sorttable.
        // for example, you can override the cell text with a customkey attribute, it also gets .value for <input> fields.
        if (!node)
            return "";

        var hasInputs = (typeof node.getElementsByTagName == 'function') && node.getElementsByTagName('input').length;

        //if (node.getAttribute("sorttable_customkey") != null) {
        //    return node.getAttribute("sorttable_customkey");
        //}
        if (typeof node.textContent != 'undefined' && !hasInputs) {
            return node.textContent.replace(/^\s+|\s+$/g, '');
        }
        else if (typeof node.innerText != 'undefined' && !hasInputs) {
            return node.innerText.replace(/^\s+|\s+$/g, '');
        }
        else if (typeof node.text != 'undefined' && !hasInputs) {
            return node.text.replace(/^\s+|\s+$/g, '');
        }
        else {
            switch (node.nodeType) {
                case 3:
                    if (node.nodeName.toLowerCase() == 'input') {
                        return node.value.replace(/^\s+|\s+$/g, '');
                    }
                case 4:
                    return node.nodeValue.replace(/^\s+|\s+$/g, '');
                    break;
                case 1:
                case 11:
                    var innerText = '';
                    for (var i = 0; i < node.childNodes.length; i++) {
                        innerText += sorttable.getInnerText(node.childNodes[i]);
                    }
                    return innerText.replace(/^\s+|\s+$/g, '');
                    break;
                default:
                    return '';
            }
        }
    },

    reverse: function(tbody) {
        // reverse the rows in a tbody
        var newrows = [];
        for (var i=0; i<tbody.rows.length; i++) {
            newrows[newrows.length] = tbody.rows[i];
        }
        for (var i=newrows.length-1; i>=0; i--) {
            tbody.appendChild(newrows[i]);
        }
        delete newrows;
    },

    sort_numeric: function(a,b) {
        var aa = parseFloat(a[0].replace(/[^0-9.-]/g,''));
        if (isNaN(aa)) aa = 0;
        var bb = parseFloat(b[0].replace(/[^0-9.-]/g,''));
        if (isNaN(bb)) bb = 0;
        return aa-bb;
    },
    sort_alpha: function(a,b) {
        if (a[0]==b[0]) return 0;
        if (a[0]<b[0]) return -1;
        return 1;
    },     
    sort_ddmm: function (a, b) {
        var dt1, dt2, y, m, d, mtch;
        mtch = a[0].match(sorttable.DATE_RE);
        y = mtch[3]; m = mtch[2]; d = mtch[1];
        if (m.length == 1) m = '0'+m;
        if (d.length == 1) d = '0'+d;
        dt1 = y+m+d;
        mtch = b[0].match(sorttable.DATE_RE);
        y = mtch[3]; m = mtch[2]; d = mtch[1];
        if (m.length == 1) m = '0'+m;
        if (d.length == 1) d = '0'+d;
        dt2 = y+m+d;
        if (dt1==dt2) return 0;
        if (dt1<dt2) return -1;
        return 1;
    },
    sort_mmdd: function (a, b) {
        var dt1, dt2, y, m, d, mtch;
        if (a[0] == null || a[0] == '') {
            dt1 = "00000000";
        }
        else {
            mtch = a[0].match(sorttable.DATE_RE);
            y = mtch[3]; d = mtch[2]; m = mtch[1];
            if (m.length == 1) m = '0' + m;
            if (d.length == 1) d = '0' + d;
            dt1 = y + m + d;
        }        
        if (b[0] == null || b[0] == '') {
            dt2 = "00000000";
        }
        else {
            mtch = b[0].match(sorttable.DATE_RE);
            y = mtch[3]; d = mtch[2]; m = mtch[1];
            if (m.length == 1) m = '0' + m;
            if (d.length == 1) d = '0' + d;
            dt2 = y + m + d;
        }
        if (dt1==dt2) return 0;
        if (dt1 < dt2) return -1;
        return 1;
    }
}

window.onload = sorttable.init;
