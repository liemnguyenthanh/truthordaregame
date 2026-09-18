import {validateGroup,MOODS} from '@/lib/groups';
import type {GenerationInput} from '@/lib/types';
export function generationInput(value:Record<string,unknown>):GenerationInput {
 const group=validateGroup(value.group);const mood=MOODS.find(m=>m.id===value.mood);
 if(!mood)throw new Error('Hãy chọn không khí cho nhóm.');
 if(mood.adultOnly&&value.adultsConfirmed!==true)throw new Error('Tất cả thành viên cần đủ 18 tuổi và đồng ý với chủ đề này.');
 return {group,mood:mood.id,adultsConfirmed:value.adultsConfirmed===true};
}
