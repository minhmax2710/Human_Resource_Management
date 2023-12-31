using System.Linq;
using Microsoft.EntityFrameworkCore;
using Abp.Authorization;
using Abp.Authorization.Roles;
using Abp.Authorization.Users;
using Abp.MultiTenancy;
using HRMv2.Authorization;
using HRMv2.Authorization.Roles;
using HRMv2.Authorization.Users;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Configuration;
using Abp.Extensions;
using System;
using System.Collections.Generic;
using static HRMv2.Authorization.PermissionNames;

namespace HRMv2.EntityFrameworkCore.Seed.Host
{
    public class HostRoleAndUserCreator
    {
        private readonly HRMv2DbContext _context;
        public HostRoleAndUserCreator(HRMv2DbContext context)
        {
            _context = context;
        }

        public void Create()
        {
            CreateHostRoleAndUsers();
        }

        private void CreateHostRoleAndUsers()
        {
            // Admin role for host

            var adminRoleForHost = _context.Roles.IgnoreQueryFilters().FirstOrDefault(r => r.TenantId == null && r.Name == StaticRoleNames.Host.Admin);
            if (adminRoleForHost == null)
            {
                adminRoleForHost = _context.Roles.Add(new Role(null, StaticRoleNames.Host.Admin, StaticRoleNames.Host.Admin) { IsStatic = true, IsDefault = true }).Entity;
                _context.SaveChanges();
            }

            // Grant all permissions to admin role for host

            var grantedPermissions = _context.Permissions.IgnoreQueryFilters()
                .OfType<RolePermissionSetting>()
                .Where(p => p.TenantId == null && p.RoleId == adminRoleForHost.Id)
                .Select(p => p.Name)
                .ToList();

            var permissions = PermissionFinder
                .GetAllPermissions(new HRMv2AuthorizationProvider())
                .Where(p => p.MultiTenancySides.HasFlag(MultiTenancySides.Host) &&
                            !grantedPermissions.Contains(p.Name))
                .ToList();

            if (permissions.Any())
            {
                _context.Permissions.AddRange(
                    permissions.Select(permission => new RolePermissionSetting
                    {
                        TenantId = null,
                        Name = permission.Name,
                        IsGranted = true,
                        RoleId = adminRoleForHost.Id
                    })
                );
                _context.SaveChanges();
            }

            // Admin user for host

            var adminUserForHost = _context.Users.IgnoreQueryFilters().FirstOrDefault(u => u.TenantId == null && u.UserName == AbpUserBase.AdminUserName);
            if (adminUserForHost == null)
            {
                var user = new User
                {
                    TenantId = null,
                    UserName = AbpUserBase.AdminUserName,
                    Name = "admin",
                    Surname = "admin",
                    EmailAddress = GetAdminHostEmail(),
                    IsEmailConfirmed = true,
                    IsActive = true
                };

                user.Password = new PasswordHasher<User>(new OptionsWrapper<PasswordHasherOptions>(new PasswordHasherOptions())).HashPassword(user, "123qwe");
                user.SetNormalizedNames();

                adminUserForHost = _context.Users.Add(user).Entity;
                _context.SaveChanges();

                // Assign Admin role to admin user
                _context.UserRoles.Add(new UserRole(null, adminUserForHost.Id, adminRoleForHost.Id));
                _context.SaveChanges();

                _context.SaveChanges();
            }
            CreateRoleAndAddPermission();
        }

        private void CreateRoleAndAddPermission()
        {
            var roleSeeds = new List<string>() { StaticRoleNames.Tenants.CEO,
                                                StaticRoleNames.Tenants.KT,
                                                StaticRoleNames.Tenants.SubKT};

            foreach (var roleSeed in roleSeeds)
            {
                var role = _context.Roles.IgnoreQueryFilters().FirstOrDefault(r => r.TenantId == null && r.Name == roleSeed);
                if (role == null)
                {
                    role = _context.Roles.Add(new Role(null, roleSeed, roleSeed) { IsStatic = false }).Entity;
                    _context.SaveChanges();

                    var grantedPermissionsByRole = GrantPermissionRoles.PermissionRoles
                                                   .Where(x => x.Key == roleSeed)
                                                   .FirstOrDefault()
                                                   .Value;
                    if (grantedPermissionsByRole != null)
                    {
                        var permissions = PermissionFinder.GetAllPermissions(new HRMv2AuthorizationProvider())
                                            .Where(p => p.MultiTenancySides.HasFlag(MultiTenancySides.Host) &&
                                                grantedPermissionsByRole.Contains(p.Name))
                                            .ToList();

                        if (permissions.Any())
                        {
                            _context.Permissions.AddRange(
                                permissions.Select(permission => new RolePermissionSetting
                                {
                                    TenantId = null,
                                    Name = permission.Name,
                                    IsGranted = true,
                                    RoleId = role.Id
                                })
                            );
                            _context.SaveChanges();
                        }
                    }
                }
            }
        }
    
        private string GetAdminHostEmail()
        {
            try
            {
                var adminHostEmail = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json")
                .Build()
                .GetValue<string>($"DefaultAdminEmail:Host");
                if (string.IsNullOrEmpty(adminHostEmail))
                {
                    adminHostEmail = "tien.nguyenhuu@ncc.asia";
                }
                return adminHostEmail;
            }
            catch(Exception e)
            {
                return "tien.nguyenhuu@ncc.asia";
            }            

        }

    }
}
