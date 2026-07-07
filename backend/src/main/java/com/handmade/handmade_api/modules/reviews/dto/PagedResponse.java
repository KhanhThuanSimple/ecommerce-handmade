package com.handmade.handmade_api.modules.reviews.dto;

import java.util.List;

/**
 * Generic paged response wrapper — dùng cho pending & completed review endpoints.
 */
public class PagedResponse<T> {

    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;

    public PagedResponse(List<T> content, int page, int size,
                         long totalElements, int totalPages) {
        this.content = content;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
    }

    public List<T> getContent()      { return content; }
    public int getPage()             { return page; }
    public int getSize()             { return size; }
    public long getTotalElements()   { return totalElements; }
    public int getTotalPages()       { return totalPages; }
}
