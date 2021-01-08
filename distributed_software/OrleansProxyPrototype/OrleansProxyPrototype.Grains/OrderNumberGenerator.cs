using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Orleans;
using OrleansProxyPrototype.GrainsInterfaces;

namespace OrleansProxyPrototype.Grains
{
    public class OrderNumberGenerator : Grain, IOrderNumberGenerator
    {
        private readonly ILogger<OrderNumberGenerator> _logger;
        private int _currentOrderNumber;

        public OrderNumberGenerator(ILogger<OrderNumberGenerator> logger)
        {
            _logger = logger;
            _currentOrderNumber = 1;
        } 
        
        public async Task<int> GenerateOrderNumber()
        {
            _currentOrderNumber++;
            _logger.LogInformation("Generated Order Number: {currentOrderNumber}", _currentOrderNumber);
            return _currentOrderNumber;
        }
    }
}