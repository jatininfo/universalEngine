using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

public class ExceptionHandlerTests
{
    [Fact]
    public async Task Exception_is_handled_and_returns_500()
    {
        using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.Configure(app =>
                {
                    app.MapGet("/cause-ex", context => throw new Exception("boom"));
                });
            });

        var client = factory.CreateClient();
        var response = await client.GetAsync("/cause-ex");
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("unexpected", content, StringComparison.OrdinalIgnoreCase);
    }
}
