import { DEFAULT_SIDEBAR_NAV_ITEMS } from '../config/sidebar-menu.defaults';
import { SidebarNavItem } from '../models/sidebar-nav-item.model';
import { filterSidebarItems } from './sidebar-filter.utils';

describe('filterSidebarItems', () => {
  const items = [
    { id: 'a', label: 'A', icon: 'x', route: '/a' },
    { id: 'b', label: 'B', icon: 'x', route: '/b', roles: [] },
    { id: 'c', label: 'C', icon: 'x', route: '/c', roles: ['admin'] },
  ] as SidebarNavItem[];

  const ids = (list: SidebarNavItem[]) => list.map((i) => i.id);

  it('deja pasar ítems sin roles o con roles vacíos', () => {
    expect(ids(filterSidebarItems(items, 'seller'))).toEqual(['a', 'b']);
  });

  it('oculta ítems restringidos si no hay rol', () => {
    expect(ids(filterSidebarItems(items, null))).toEqual(['a', 'b']);
  });

  it('muestra ítems restringidos al rol permitido', () => {
    expect(ids(filterSidebarItems(items, 'admin'))).toEqual(['a', 'b', 'c']);
  });

  // H-02: el sidebar por defecto no debe ofrecer a un cajero lo que sus rutas le niegan.
  describe('menú por defecto', () => {
    const idsFor = (role: 'admin' | 'seller' | 'manager') =>
      ids(filterSidebarItems(DEFAULT_SIDEBAR_NAV_ITEMS, role));

    it('seller no ve Administración ni Cajeros', () => {
      expect(idsFor('seller')).not.toContain('admin');
      expect(idsFor('seller')).not.toContain('manager-cashiers');
    });

    it('seller no ve Reportes (el back exige reporte.ver) y manager y admin sí', () => {
      expect(idsFor('seller')).not.toContain('reports');
      expect(idsFor('manager')).toContain('reports');
      expect(idsFor('admin')).toContain('reports');
    });

    it('manager ve Cajeros pero no Administración', () => {
      expect(idsFor('manager')).toContain('manager-cashiers');
      expect(idsFor('manager')).not.toContain('admin');
    });

    it('admin ve Administración y Cajeros', () => {
      expect(idsFor('admin')).toEqual(expect.arrayContaining(['admin', 'manager-cashiers']));
    });
  });
});
