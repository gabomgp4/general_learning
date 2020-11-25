using System;
using System.Threading.Tasks;
using Orleans;

namespace OrleansProxyPrototype.GrainsInterfaces
{
    public interface IOrderNumberGenerator : IGrainWithStringKey
    {
        Task<int> GenerateOrderNumber();
    }
}