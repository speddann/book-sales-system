namespace Booksales.API.Common;

public class BusinessException : Exception
{
    public BusinessException(string message) : base(message)
    {
    }
}
