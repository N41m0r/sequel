using System.Diagnostics;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using static System.Runtime.InteropServices.RuntimeInformation;
using static System.Runtime.InteropServices.OSPlatform;

namespace Sequel
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            services.AddCors();
            services.AddControllers();
        }

        public void Configure(IApplicationBuilder app, IHostEnvironment env)
        {
            app.UseDefaultFiles();
            app.UseStaticFiles();
            app.UseExceptionHandler("/detailed-error");
            app.UseCors(options => options.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader().WithExposedHeaders("Content-Length"));
            app.UseRouting();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });

            if (env.IsProduction())
            {
                OpenDefaultBrowser();
            }
        }

        private void OpenDefaultBrowser()
        {
            try
            {
                string port = Configuration["urls"].Substring(Configuration["urls"].Length - 4);
                string url = $"http://localhost:{port}";

                if (IsOSPlatform(Windows))
                {
                    var psi = new ProcessStartInfo { FileName = url, UseShellExecute = true };
                    Process.Start(psi);
                }
                else if (IsOSPlatform(Linux))
                {
                    Process.Start("xdg-open", url);
                }
                else if (IsOSPlatform(OSX))
                {
                    Process.Start("open", url);
                }
            }
            catch {}
        }
    }
}
