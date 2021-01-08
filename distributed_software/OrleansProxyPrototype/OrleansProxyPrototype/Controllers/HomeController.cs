using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Orleans;
using OrleansProxyPrototype.GrainsInterfaces;

namespace OrleansProxyPrototype.Controllers
{
    public class HomeController : Controller
    {
        private readonly IClusterClient _clusterClient;

        public HomeController(IClusterClient clusterClient)
        {
            _clusterClient = clusterClient;
        }

        [Route("/home/{*segments}")]
        public async Task<int> Index()
        {
            var orderNumberGenerator = _clusterClient.GetGrain<IOrderNumberGenerator>("Demo");
            var orderNumber = await orderNumberGenerator.GenerateOrderNumber();
            return orderNumber;
        }
    }
}