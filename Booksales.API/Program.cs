using Microsoft.EntityFrameworkCore;
using Booksales.API.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// 👇 IMPORTANT LINE (force binding)
builder.WebHost.UseUrls("http://0.0.0.0:5145");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

app.MapControllers();

app.Run();