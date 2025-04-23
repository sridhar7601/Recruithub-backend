/**
 * Interface for paginated response data.
 */
export interface PaginatedResponse<T> {
    /**
     * The array of items for the current page.
     */
    items: T[];
    
    /**
     * Metadata about the pagination.
     */
    meta: {
      /**
       * The total number of items across all pages.
       */
      totalItems: number;
      
      /**
       * The number of items per page.
       */
      itemsPerPage: number;
      
      /**
       * The current page number.
       */
      currentPage: number;
      
      /**
       * The total number of pages.
       */
      totalPages: number;
    };
  }