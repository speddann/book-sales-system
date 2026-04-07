using Booksales.API.Data;
using Booksales.API.Middleware;
using Booksales.API.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddScoped<ISalesService, SalesService>();
builder.Services.AddScoped<IBookService, BookService>();


// 👇 IMPORTANT LINE (force binding)
builder.WebHost.UseUrls("http://0.0.0.0:5145");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

app.UseMiddleware<ExceptionMiddleware>();

app.UseSwagger();
app.UseSwaggerUI();

app.MapGet("/", () => Results.Redirect("/swagger"));
app.MapControllers();

app.Run();