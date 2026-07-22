namespace EmployeeManagement.Domain.Entities;

public sealed class Address
{
    private Address()
    {
    }

    public Address(
        string street,
        string city,
        string country,
        string postalCode)
    {
        Street = street;
        City = city;
        Country = country;
        PostalCode = postalCode;
    }

    public string Street { get; private set; } = string.Empty;

    public string City { get; private set; } = string.Empty;

    public string Country { get; private set; } = string.Empty;

    public string PostalCode { get; private set; } = string.Empty;
}