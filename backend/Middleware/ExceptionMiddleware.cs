using System.Net;
using System.Text.Json;
using Booksales.API.Common;

namespace Booksales.API.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;

    public ExceptionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = ex switch
        {
            NotFoundException => (int)HttpStatusCode.NotFound,
            BusinessException  => (int)HttpStatusCode.BadRequest,
            _                  => (int)HttpStatusCode.InternalServerError
        };

        var response = new
        {
            IsSuccess = false,
            Message = ex.Message,
            Data = (object)null
        };

        return context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}