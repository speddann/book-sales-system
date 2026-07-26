namespace Booksales.API.DTOs;

public class InventoryImportRowDto
{
    public int RowNumber { get; set; }
    public string ISBN { get; set; } = string.Empty;
    public string? BookTitle { get; set; }
    public string? Author { get; set; }
    public string? Category { get; set; }
    public string? Language { get; set; }
    public int? CurrentStock { get; set; }
    public int Quantity { get; set; }
    public string TransactionType { get; set; } = string.Empty;
    public int? StockAfter { get; set; }
    public string ReasonCategory { get; set; } = string.Empty;
    public DateTime? TransactionDate { get; set; }
    public string? Notes { get; set; }
    public string Status { get; set; } = "Pending";
    public string? ErrorMessage { get; set; }
}

public class InventoryImportPreviewResponse
{
    public int TotalRows { get; set; }
    public int ValidRowCount { get; set; }
    public int ErrorRowCount { get; set; }
    public List<InventoryImportRowDto> ValidRows { get; set; } = new();
    public List<InventoryImportRowDto> ErrorRows { get; set; } = new();
    public List<InventoryImportErrorDto> Errors { get; set; } = new();
}

public class InventoryImportConfirmRequest
{
    public List<InventoryImportRowDto> Rows { get; set; } = new();
}

public class InventoryImportResultDto
{
    public int TotalRows { get; set; }
    public int ValidRows { get; set; }
    public int ErrorRows { get; set; }
    public int ImportedRows { get; set; }
    public List<InventoryImportErrorDto> Errors { get; set; } = new();
}

public class InventoryImportErrorDto
{
    public int RowNumber { get; set; }
    public string ISBN { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
